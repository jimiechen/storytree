import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  
  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    console.log('Waiting...');
    await page.waitForTimeout(3000); // wait 3s
    await page.screenshot({ path: 'login_result.png' });
    console.log('Current URL:', page.url());
    
    if (page.url().includes('projects')) {
      console.log('Taking full projects screenshot...');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'current_projects_page.png', fullPage: true });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
