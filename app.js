const LIFF_ID = "2009827198-xpSRx2mI";
const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxvQVuHD9_jTq1FqfhvL627OvG9Olf42X2lGoE5S_4VO--sfKw5Xo7nbyDcgddelLbwIA/exec";

document.addEventListener("DOMContentLoaded", () => {
  initializeLiff();
  const form = document.getElementById("registrationForm");
  form.addEventListener("submit", handleFormSubmit);
});

async function initializeLiff() {
  try {
    await liff.init({ liffId: LIFF_ID });
    if (!liff.isLoggedIn()) {
      liff.login();
    } else {
      fetchEmployees();
    }
  } catch (err) {
    console.error("LIFF初期化失敗", err);
  }
}

async function fetchEmployees() {
  const referrerSelect = document.getElementById('referrer');
  const loadingText = document.getElementById('referrerLoading');
  loadingText.style.display = 'block'; 

  try {
    const response = await fetch(GAS_WEBAPP_URL);
    const result = await response.json();

    if (result.success && result.employees) {
      result.employees.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        referrerSelect.appendChild(option);
      });

      // TomSelectによる検索機能
      new TomSelect("#referrer", {
        create: false,
        placeholder: "名前を検索して選択...",
        maxOptions: null
      });
    }
  } catch (error) {
    console.error("通信エラー:", error);
  } finally {
    loadingText.style.display = 'none'; 
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();
  
  const submitBtn = event.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "送信中...";

  // 1. LINE IDを取得（liff.getProfile()をawaitしてIDを取得する）
  let lineId = "不明";
  try {
    const profile = await liff.getProfile();
    lineId = profile.userId;
  } catch (err) {
    console.error("LINE IDの取得に失敗しました", err);
  }

  // 2. フォームデータを取得
  const formData = new FormData(event.target);
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    params.append(key, value);
  }
  
  // 3. 取得したLINE IDを送信データに追加
  params.append("lineId", lineId);

  try {
    const response = await fetch(GAS_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    const result = await response.json();

    if (result.success) {
      alert("登録が完了しました！");
      liff.closeWindow();
    } else {
      alert("エラーが発生しました: " + result.error);
      submitBtn.disabled = false;
      submitBtn.textContent = "登録する";
    }
  } catch (error) {
    console.error("通信エラー:", error);
    alert("通信エラーが発生しました。");
    submitBtn.disabled = false;
    submitBtn.textContent = "登録する";
  }
}