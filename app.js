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
    alert("LIFFの初期化に失敗しました。");
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
      new TomSelect("#referrer", {
        create: false,
        placeholder: "名前を検索して選択...",
        maxOptions: null 
      });
    }
  } catch (error) {
    console.error(error);
  } finally {
    loadingText.style.display = 'none'; 
  }
}

// =========================================
// ★追加：ローディング画面を制御する関数
// =========================================
function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex'; 
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}
// =========================================

async function handleFormSubmit(event) {
  event.preventDefault(); 
  
  const submitBtn = event.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "送信中...";

  // ★ここでローディング画面を表示！
  showLoading();

  let lineId = "不明";
  try {
    const profile = await liff.getProfile();
    lineId = profile.userId;
  } catch (err) {}

  const formData = new FormData(event.target);
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    params.append(key, value);
  }
  params.append("lineId", lineId);

  try {
    const response = await fetch(GAS_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    const result = await response.json();

    if (result.success) {
      const statusCode = result.anycrossStatus; 
      const anycross = result.anycrossResponse || {};
      const bodyStatus = anycross.status || anycross.statusCode || anycross.code;

      if (statusCode === 300 || statusCode === 330 || statusCode === 333) {
        
        let suggestedName = "不明";
        if (anycross.name && typeof anycross.name === 'object' && anycross.name["名前"]) {
          suggestedName = anycross.name["名前"];
        } else if (anycross.name && typeof anycross.name === 'string') {
          suggestedName = anycross.name;
        }
        
        // ★アラートの前にローディングを消す
        hideLoading();
        alert(`同姓同名の方がすでにいるので、今後は以下の名前を必ずご使用ください\n\n${suggestedName}`);
        
        submitBtn.textContent = "登録完了";

      } else if (statusCode === 400 || bodyStatus == 400) {
        
        // ★アラートの前にローディングを消す
        hideLoading();
        alert("すでに登録されています。修正がある場合は社員へお声がけください。");
        
        submitBtn.disabled = false;
        submitBtn.textContent = "登録する";

      } else {
        // ★アラートの前にローディングを消す
        hideLoading();
        alert("登録が完了しました！");
        liff.closeWindow(); 
      }
    } else {
      // ★エラー時もローディングを消す
      hideLoading();
      alert("エラーが発生しました: " + result.error);
      submitBtn.disabled = false;
      submitBtn.textContent = "登録する";
    }
  } catch (error) {
    // ★通信エラー時もローディングを消す
    hideLoading();
    alert("通信エラーが発生しました。");
    submitBtn.disabled = false;
    submitBtn.textContent = "登録する";
  }
}