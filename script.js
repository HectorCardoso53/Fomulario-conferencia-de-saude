const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwX-ZqXtyHBc6EYVDFacqHUEfXnadxX7QcsJ30rdnR_Ka4E9uFEuLaC_WKmxWn0NwMW3A/exec";

const form  = document.getElementById("feedbackForm");
const btn   = document.getElementById("submitBtn");
const toast = document.getElementById("toast");

function showToast(type, msg) {
  toast.className = "toast " + type;
  document.getElementById("toastIcon").textContent = type === "success" ? "✓" : "✕";
  document.getElementById("toastMsg").textContent  = msg;
}

function validate() {
  let ok = true;

  const nome      = document.getElementById("nome").value.trim();
  const fieldNome = document.getElementById("field-nome");
  if (nome.length < 3) { fieldNome.classList.add("has-error"); ok = false; }
  else fieldNome.classList.remove("has-error");

  const email      = document.getElementById("email").value.trim();
  const fieldEmail = document.getElementById("field-email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { fieldEmail.classList.add("has-error"); ok = false; }
  else fieldEmail.classList.remove("has-error");

  const opiniao      = document.getElementById("opiniao").value.trim();
  const fieldOpiniao = document.getElementById("field-opiniao");
  if (opiniao.length < 5) { fieldOpiniao.classList.add("has-error"); ok = false; }
  else fieldOpiniao.classList.remove("has-error");

  return ok;
}

// Verifica se o e-mail já foi cadastrado consultando a planilha
async function emailJaCadastrado(email) {
  try {
    const url = SCRIPT_URL + "?acao=verificar&email=" + encodeURIComponent(email);
    const res = await fetch(url);
    const data = await res.json();
    return data.existe === true;
  } catch (err) {
    // Se não conseguir verificar, permite continuar
    return false;
  }
}

// Envia os dados via iframe (sem bloqueio de CORS)
function enviarViaIframe(params) {
  return new Promise((resolve) => {
    const iframeName = "hidden_frame_" + Date.now();
    const iframe     = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.name          = iframeName;
    document.body.appendChild(iframe);

    const tempForm  = document.createElement("form");
    tempForm.method = "GET";
    tempForm.action = SCRIPT_URL;
    tempForm.target = iframeName;

    for (const [key, val] of params.entries()) {
      const input = document.createElement("input");
      input.type  = "hidden";
      input.name  = key;
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

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  toast.className = "toast";
  if (!validate()) return;

  const nome    = document.getElementById("nome").value.trim();
  const email   = document.getElementById("email").value.trim();
  const opiniao = document.getElementById("opiniao").value.trim();

  btn.disabled = true;
  btn.classList.add("loading");

  // ── Verificar e-mail duplicado ──
  const duplicado = await emailJaCadastrado(email);
  if (duplicado) {
    const fieldEmail = document.getElementById("field-email");
    fieldEmail.classList.add("has-error");
    fieldEmail.querySelector(".field-error").textContent = "Este e-mail já enviou uma resposta.";
    fieldEmail.classList.add("has-error");
    showToast("error", "Este e-mail já foi cadastrado. Cada pessoa pode responder apenas uma vez.");
    btn.disabled = false;
    btn.classList.remove("loading");
    return;
  }

  try {
    const params = new URLSearchParams({ nome, email, opiniao });
    await enviarViaIframe(params);
    showToast("success", "Obrigado! Seu feedback foi enviado com sucesso.");
    form.reset();
  } catch (err) {
    showToast("error", "Erro ao enviar. Verifique sua conexão e tente novamente.");
  } finally {
    btn.disabled = false;
    btn.classList.remove("loading");
  }
});