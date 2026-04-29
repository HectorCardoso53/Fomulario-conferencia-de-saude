const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwX-ZqXtyHBc6EYVDFacqHUEfXnadxX7QcsJ30rdnR_Ka4E9uFEuLaC_WKmxWn0NwMW3A/exec";

const form = document.getElementById("feedbackForm");
const btn = document.getElementById("submitBtn");

// Sempre busca o toast no DOM para evitar null
function getToast() {
  return document.getElementById("toast");
}

function showToast(type, msg) {
  const toast = getToast();
  if (!toast) return;
  toast.className = "toast " + type;
  document.getElementById("toastIcon").textContent =
    type === "success" ? "✓" : "✕";
  document.getElementById("toastMsg").textContent = msg;
}

function hideToast() {
  const toast = getToast();
  if (toast) toast.className = "toast";
}

function validate() {
  let ok = true;

  // ── Nome ──
  const nome = document.getElementById("nome").value.trim();
  const fieldNome = document.getElementById("field-nome");
  const nomeValido =
    /^[A-ZÀ-Ú][a-zA-Zà-úÀ-Ú]*(?: (?:de|da|do|dos|das|e|[A-ZÀ-Ú])[a-zA-Zà-úÀ-Ú]*)+$/.test(
      nome,
    );

  if (nome.length < 3) {
    fieldNome.classList.add("has-error");
    fieldNome.querySelector(".field-error").textContent =
      "Por favor, informe seu nome completo.";
    ok = false;
  } else if (!nomeValido) {
    fieldNome.classList.add("has-error");
    fieldNome.querySelector(".field-error").textContent =
      "Digite nome e sobrenome com inicial maiúscula. Ex: Maria Silva";
    ok = false;
  } else {
    fieldNome.classList.remove("has-error");
  }

  // ── E-mail ──
  const email = document.getElementById("email").value.trim();
  const fieldEmail = document.getElementById("field-email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldEmail.classList.add("has-error");
    fieldEmail.querySelector(".field-error").textContent =
      "Informe um e-mail válido.";
    ok = false;
  } else {
    fieldEmail.classList.remove("has-error");
  }

  // ── Opinião ──
  const opiniao = document.getElementById("opiniao").value.trim();
  const fieldOpiniao = document.getElementById("field-opiniao");
  if (opiniao.length < 5) {
    fieldOpiniao.classList.add("has-error");
    ok = false;
  } else {
    fieldOpiniao.classList.remove("has-error");
  }

  // ── Declaração ──
  const declaracao = document.getElementById("declaracao").checked;
  const fieldDeclaracao = document.getElementById("field-declaracao");
  if (!declaracao) {
    fieldDeclaracao.classList.add("has-error");
    ok = false;
  } else {
    fieldDeclaracao.classList.remove("has-error");
  }

  return ok;
}

// Verifica se o e-mail já foi cadastrado
async function emailJaCadastrado(email) {
  try {
    const url =
      SCRIPT_URL + "?acao=verificar&email=" + encodeURIComponent(email);
    const res = await fetch(url);
    const data = await res.json();
    return data.existe === true;
  } catch (err) {
    return false;
  }
}

// Envia via iframe para evitar bloqueio de CORS
function enviarViaIframe(params) {
  return new Promise((resolve) => {
    const iframeName = "hidden_frame_" + Date.now();
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.name = iframeName;
    document.body.appendChild(iframe);

    const tempForm = document.createElement("form");
    tempForm.method = "GET";
    tempForm.action = SCRIPT_URL;
    tempForm.target = iframeName;

    for (const [key, val] of params.entries()) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = val;
      tempForm.appendChild(input);
    }

    document.body.appendChild(tempForm);
    iframe.onload = () => {
      document.body.removeChild(tempForm);
      document.body.removeChild(iframe);
      resolve();
    };
    setTimeout(resolve, 5000);
    tempForm.submit();
  });
}

// ── Submit ──
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideToast();

  if (!validate()) return;

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const opiniao = document.getElementById("opiniao").value.trim();

  btn.disabled = true;
  btn.classList.add("loading");

  // Verifica duplicado
  const duplicado = await emailJaCadastrado(email);
  if (duplicado) {
    const fieldEmail = document.getElementById("field-email");
    fieldEmail.classList.add("has-error");
    fieldEmail.querySelector(".field-error").textContent =
      "Este e-mail já enviou uma resposta.";
    showToast(
      "error",
      "Este e-mail já foi cadastrado. Cada pessoa pode responder apenas uma vez.",
    );
    btn.disabled = false;
    btn.classList.remove("loading");
    return;
  }

  try {
    const params = new URLSearchParams({ nome, email, opiniao });
    await enviarViaIframe(params);
    form.reset();
    abrirModal();
    setTimeout(() => hideToast(), 5000);
  } catch (err) {
    showToast(
      "error",
      "Erro ao enviar. Verifique sua conexão e tente novamente.",
    );
    setTimeout(() => hideToast(), 5000);
  } finally {
    btn.disabled = false;
    btn.classList.remove("loading");
  }
});

// ── Orientação ao focar no nome ──
document.getElementById("nome").addEventListener("focus", () => {
  showToast(
    "info",
    "Digite nome e sobrenome com inicial maiúscula para emissão do certificado. Ex: Maria da Silva",
  );
});

document.getElementById("nome").addEventListener("blur", () => {
  const toast = getToast();
  if (toast && toast.classList.contains("info")) hideToast();
});


function abrirModal() {
  document.getElementById("modalSucesso").classList.add("ativo");
}

function fecharModal() {
  document.getElementById("modalSucesso").classList.remove("ativo");
}