const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxFYnBS-q9DNvp2J1v9BcaFos36PVDKZIv7E5hoBNjX1Gk0WSqPX5uWEJHzN1cXJy79wg/exec";

const form = document.getElementById("confirmacaoForm");
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

function validate() {
  const email = document.getElementById("email").value.trim();
  const fieldEmail = document.getElementById("field-email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldEmail.classList.add("has-error");
    fieldEmail.querySelector(".field-error").textContent = "Informe um e-mail válido.";
    return false;
  }
  fieldEmail.classList.remove("has-error");
  return true;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideToast();

  if (!validate()) return;

  const email = document.getElementById("email").value.trim();

  btn.disabled = true;
  btn.classList.add("loading");

  try {
    const url = SCRIPT_URL + "?acao=confirmar&email=" + encodeURIComponent(email);
    const res = await fetch(url);
    const data = await res.json();

    if (data.nao_encontrado) {
      const fieldEmail = document.getElementById("field-email");
      fieldEmail.classList.add("has-error");
      fieldEmail.querySelector(".field-error").textContent =
        "E-mail não encontrado. Verifique se está inscrito.";
      showToast("error", "E-mail não encontrado. Realize sua inscrição primeiro.");
      return;
    }

    if (data.ja_confirmado) {
      showToast("error", "Presença já confirmada anteriormente para este e-mail.");
      return;
    }

    if (data.sucesso) {
      form.reset();
      document.getElementById("modalNome").textContent =
        "Olá, " + data.nome + "! Sua presença na Palestra de Empreendedorismo foi registrada com sucesso.";
      abrirModal();
    }

  } catch (err) {
    console.error("Erro:", err);
    showToast("error", "Erro ao confirmar. Verifique sua conexão e tente novamente.");
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
