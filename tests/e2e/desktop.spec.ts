import { test, expect } from '@playwright/test';

test.describe('Desktop OS E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const userObj = {
        id: "test-user-id",
        email: "dev@local.dev",
        name: "Dev User"
      };
      
      window.localStorage.setItem("kuro_dev_user", JSON.stringify(userObj));
      
      window.localStorage.setItem("sb-ajrbswwyfqubbsiddtmb-auth-token", JSON.stringify({
        access_token: "mock-access-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "mock-refresh-token",
        user: {
          id: userObj.id,
          aud: "authenticated",
          role: "authenticated",
          email: userObj.email,
          email_confirmed_at: "2026-06-11T12:00:00Z",
          phone: "",
          confirmed_at: "2026-06-11T12:00:00Z",
          last_sign_in_at: "2026-06-11T12:00:00Z",
          app_metadata: {
            provider: "email",
            providers: ["email"]
          },
          user_metadata: {
            name: userObj.name
          },
          identities: [],
          created_at: "2026-06-11T12:00:00Z",
          updated_at: "2026-06-11T12:00:00Z"
        },
        expires_at: Math.floor(Date.now() / 1000) + 36000
      }));

      window.localStorage.setItem("kuro-storage", JSON.stringify({
        state: {
          settings: {
            preferredBrowser: "Default System Browser",
            theme: "dark",
            aiProvider: "groq",
            isOnboarded: true
          },
          profile: {
            name: "Dev User",
            email: "dev@local.dev",
            focus: "both"
          },
          activeWorkspace: null,
          workspaces: [],
          activeModule: "instance-dashboard"
        },
        version: 0
      }));
    });
    await page.goto('/');
  });
  test('app launches to empty desktop with taskbar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="taskbar"]')).toBeVisible();
    await expect(page.locator('[data-window]')).toHaveCount(0);
  });

  test('K button opens launcher', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="launcher-btn"]');
    await expect(page.locator('[placeholder="Search modules…"]')).toBeVisible();
  });

  test('clicking Instances in launcher opens window', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="launcher-btn"]');
    await page.click('[data-testid="launcher-item-instances"]');
    await expect(page.locator('[data-window]')).toHaveCount(1);
    await expect(page.locator('[data-window]')).toContainText('Instance Dashboard');
  });

  test('close button removes window from desktop', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="launcher-btn"]');
    await page.click('[data-testid="launcher-item-notes"]');
    await expect(page.locator('[data-window]')).toHaveCount(1);
    
    const closeBtn = page.locator('[data-window] div[style*="width: 10"]').first();
    await closeBtn.click();
    await expect(page.locator('[data-window]')).toHaveCount(0);
  });

  test('opening same module twice focuses existing, does not duplicate', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="launcher-btn"]');
    await page.click('[data-testid="launcher-item-instances"]');
    await page.click('[data-testid="launcher-btn"]');
    await page.click('[data-testid="launcher-item-instances"]');
    await expect(page.locator('[data-window]')).toHaveCount(1);
  });

  test('multiple modules open simultaneously', async ({ page }) => {
    await page.goto('/');
    for (const modId of ['instances', 'tasks']) {
      await page.click('[data-testid="launcher-btn"]');
      await page.click(`[data-testid="launcher-item-${modId}"]`);
    }
    await expect(page.locator('[data-window]')).toHaveCount(2);
  });
});
