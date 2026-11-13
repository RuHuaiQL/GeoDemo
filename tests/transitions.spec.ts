import {expect, test} from '@playwright/test';

test('首屏和每次切换都显现，连续选择以最后一个模块为准', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.addInitScript(() => {
    document.addEventListener('animationstart', event => {
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.matches('.experiment-content, .observatory-header, .solar-heading, .eclipse-heading, .controls-grid')) {
        event.target.dataset.appearance = event.animationName;
      }
    });
  });
  await page.goto('/');
  const content = page.locator('.experiment-content');
  const nav = page.getByRole('navigation', {name:'实验模块'});
  await expect(page.locator('.observatory-header')).toHaveAttribute('data-appearance', 'scene-appear');
  await expect(page.locator('.controls-grid')).toHaveAttribute('data-appearance', 'instrument-appear');
  await nav.getByRole('button', {name:'太阳视运动'}).click();
  await expect(page.locator('.solar-heading')).toHaveAttribute('data-appearance', 'instrument-appear');
  await nav.evaluate(element => {
    const buttons = element.querySelectorAll('button');
    buttons[0].click();
    buttons[2].click();
  });
  await expect(page.locator('.eclipse-heading')).toHaveAttribute('data-appearance', 'instrument-appear');
  await expect(content).toHaveCSS('opacity', '1');
  await nav.getByRole('button', {name:'月相实验'}).press('Enter');
  await expect(page.locator('.controls-grid')).toHaveAttribute('data-appearance', 'instrument-appear');
  await expect(nav.getByRole('button', {name:'月相实验'})).toBeFocused();
});

test('减少动态效果时直接显示实验', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.locator('.controls-grid')).toHaveCSS('animation-name', 'none');
  await page.getByRole('button', {name:'月食模拟'}).click();
  await expect(page.locator('.eclipse-heading')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.experiment-content')).toHaveCSS('opacity', '1');
});
