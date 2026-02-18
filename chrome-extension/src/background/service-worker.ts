// 확장 프로그램 설치 시 옵션 페이지 자동으로 열기
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.runtime.openOptionsPage();
    }
});

// Side Panel 클릭 시 열기
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('Side panel error:', error));
