const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz5Fe8AD5n2iJPAf3XPxj-TCMTuOlArLK8kw4lJ-CaVv4L3WKFAM74s1pAs6xL04ZQWsQ/exec";

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

// Máscara de CPF
document.getElementById("cpf").addEventListener("input", (e) => {
  let v = e.target.value.replace(/\D/g, "").slice(0, 11);
  v = v.replace(/^(\d{3})(\d)/, "$1.$2");
  v = v.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
  v = v.replace(/\.(\d{3})(\d)/, ".$1-$2");
  e.target.value = v;
});

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
  let r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(cpf[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
  r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(cpf[10]);
}

// Máscara de telefone — qualquer DDD
const telInput = document.getElementById("telefone");

telInput.addEventListener("input", (e) => {
  let digits = e.target.value.replace(/\D/g, "").slice(0, 11);
  let v = "";
  if (digits.length > 0) v = "(" + digits.slice(0, 2);
  if (digits.length >= 3) v += ") " + digits.slice(2, digits.length <= 10 ? 6 : 7);
  if (digits.length >= (digits.length <= 10 ? 7 : 8)) {
    v += "-" + digits.slice(digits.length <= 10 ? 6 : 7);
  }
  e.target.value = v;
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

  // ── CPF ──
  const cpf = document.getElementById("cpf").value.trim();
  const fieldCpf = document.getElementById("field-cpf");
  if (!validarCPF(cpf)) {
    fieldCpf.classList.add("has-error");
    fieldCpf.querySelector(".field-error").textContent = "Informe um CPF válido.";
    ok = false;
  } else {
    fieldCpf.classList.remove("has-error");
  }

  // ── Telefone (opcional) ──
  const telefone = document.getElementById("telefone").value.replace(/\D/g, "");
  const fieldTelefone = document.getElementById("field-telefone");
  if (telefone.length > 0 && (telefone.length < 10 || telefone.length > 11)) {
    fieldTelefone.classList.add("has-error");
    fieldTelefone.querySelector(".field-error").textContent =
      "Telefone incompleto. Ex: (93) 99999-9999";
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

// Verifica se o CPF já está inscrito
async function cpfJaCadastrado(cpf) {
  try {
    const url = SCRIPT_URL + "?acao=verificar_cpf&cpf=" + encodeURIComponent(cpf.replace(/\D/g, ""));
    const res = await fetch(url);
    const data = await res.json();
    return data.existe === true;
  } catch {
    return false;
  }
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
  const cpf = document.getElementById("cpf").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const instituicao = document.getElementById("instituicao").value.trim();

  btn.disabled = true;
  btn.classList.add("loading");

  // Verifica duplicidade por e-mail e CPF (telefone só se preenchido)
  const telDigitos = telefone.replace(/\D/g, "");
  const [emailDuplicado, cpfDuplicado, telefoneDuplicado] = await Promise.all([
    emailJaCadastrado(email),
    cpfJaCadastrado(cpf),
    telDigitos.length >= 10 ? telefoneJaCadastrado(telDigitos) : Promise.resolve(false),
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

  if (cpfDuplicado) {
    const fieldCpf = document.getElementById("field-cpf");
    fieldCpf.classList.add("has-error");
    fieldCpf.querySelector(".field-error").textContent = "Este CPF já está inscrito.";
    showToast("error", "Este CPF já foi cadastrado. Cada pessoa pode se inscrever apenas uma vez.");
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
    params.append("cpf", cpf.replace(/\D/g, ""));
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
