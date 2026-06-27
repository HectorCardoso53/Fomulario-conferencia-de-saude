const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzBJPPVSF9WLZ-Nip3Z57KW1Rj0GCIUShxVuOAt_cnI8RHjpI07RyQhmmKzDZL0CxbBPg/exec";

const form = document.getElementById("feedbackForm");
const btn = document.getElementById("submitBtn");

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

// Máscara de telefone — DDD 93 fixo + 9 dígitos
const telInput = document.getElementById("telefone");
const PREFIX = "(93) ";

telInput.addEventListener("focus", () => {
  if (!telInput.value.startsWith(PREFIX)) {
    telInput.value = PREFIX;
  }
});

telInput.addEventListener("input", (e) => {
  let v = e.target.value;
  if (!v.startsWith(PREFIX)) v = PREFIX;
  let digits = v.slice(PREFIX.length).replace(/\D/g, "").slice(0, 9);
  if (digits.length > 5) {
    digits = digits.slice(0, 5) + "-" + digits.slice(5);
  }
  e.target.value = PREFIX + digits;
});

telInput.addEventListener("keydown", (e) => {
  const pos = e.target.selectionStart;
  if ((e.key === "Backspace" || e.key === "Delete") && pos <= PREFIX.length) {
    e.preventDefault();
  }
});

function validate() {
  let ok = true;

  // ── Nome ──
  const nome = document.getElementById("nome").value.trim();
  const fieldNome = document.getElementById("field-nome");
  const nomeValido =
    /^[A-ZÀ-Ú][a-zA-Zà-úÀ-Ú]*(?: (?:de|da|do|dos|das|e|[A-ZÀ-Ú])[a-zA-Zà-úÀ-Ú]*)+$/.test(nome);

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

  // ── Telefone ──
  const telefone = document.getElementById("telefone").value.replace(/\D/g, "");
  const fieldTelefone = document.getElementById("field-telefone");
  if (telefone.length < 10 || telefone.length > 11) {
    fieldTelefone.classList.add("has-error");
    fieldTelefone.querySelector(".field-error").textContent =
      "Informe um telefone válido. Ex: (91) 99999-9999";
    ok = false;
  } else {
    fieldTelefone.classList.remove("has-error");
  }

  // ── Instituição ──
  const instituicao = document.getElementById("instituicao").value.trim();
  const fieldInstituicao = document.getElementById("field-instituicao");
  if (instituicao.length < 2) {
    fieldInstituicao.classList.add("has-error");
    ok = false;
  } else {
    fieldInstituicao.classList.remove("has-error");
  }

  return ok;
}

// Verifica se o e-mail já está inscrito
async function emailJaCadastrado(email) {
  try {
    const url = SCRIPT_URL + "?acao=verificar_email&email=" + encodeURIComponent(email);
    const res = await fetch(url);
    const data = await res.json();
    return data.existe === true;
  } catch {
    return false;
  }
}

// Verifica se o telefone já está inscrito
async function telefoneJaCadastrado(telefone) {
  try {
    const url = SCRIPT_URL + "?acao=verificar_telefone&telefone=" + encodeURIComponent(telefone);
    const res = await fetch(url);
    const data = await res.json();
    return data.existe === true;
  } catch {
    return false;
  }
}

// Verifica se o limite de 100 inscrições foi atingido
async function limiteAlcancado() {
  try {
    const url = SCRIPT_URL + "?acao=verificar_limite";
    const res = await fetch(url);
    const data = await res.json();
    return data.limite_alcancado === true;
  } catch {
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
  const telefone = document.getElementById("telefone").value.trim();
  const instituicao = document.getElementById("instituicao").value.trim();

  btn.disabled = true;
  btn.classList.add("loading");

  // Verifica se o limite de inscrições foi atingido
  const limite = await limiteAlcancado();
  if (limite) {
    showToast(
      "error",
      "O limite de inscrições já foi alcançado. Não é possível realizar novas inscrições.",
    );
    btn.disabled = false;
    btn.classList.remove("loading");
    return;
  }

  // Verifica duplicidade por e-mail e telefone em paralelo
  const [emailDuplicado, telefoneDuplicado] = await Promise.all([
    emailJaCadastrado(email),
    telefoneJaCadastrado(telefone.replace(/\D/g, "")),
  ]);

  if (emailDuplicado) {
    const fieldEmail = document.getElementById("field-email");
    fieldEmail.classList.add("has-error");
    fieldEmail.querySelector(".field-error").textContent = "Este e-mail já está inscrito.";
    showToast("error", "Este e-mail já foi cadastrado. Cada pessoa pode se inscrever apenas uma vez.");
    btn.disabled = false;
    btn.classList.remove("loading");
    return;
  }

  if (telefoneDuplicado) {
    const fieldTelefone = document.getElementById("field-telefone");
    fieldTelefone.classList.add("has-error");
    fieldTelefone.querySelector(".field-error").textContent = "Este telefone já está inscrito.";
    showToast("error", "Este número já foi cadastrado. Cada pessoa pode se inscrever apenas uma vez.");
    btn.disabled = false;
    btn.classList.remove("loading");
    return;
  }

  try {
    const params = new URLSearchParams();
    params.append("nome", nome);
    params.append("email", email);
    params.append("telefone", telefone);
    params.append("instituicao", instituicao);

    await enviarViaIframe(params);

    form.reset();
    abrirModal();
  } catch (err) {
    console.error("Erro no envio:", err);
    showToast(
      "error",
      "Erro ao enviar. Verifique sua conexão e tente novamente.",
    );
  } finally {
    btn.disabled = false;
    btn.classList.remove("loading");
  }
});

function abrirModal() {
  document.getElementById("modalSucesso").classList.add("ativo");
}

function fecharModal() {
  document.getElementById("modalSucesso").classList.remove("ativo");
}
