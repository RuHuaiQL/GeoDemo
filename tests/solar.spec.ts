import {test, expect} from '@playwright/test';

test('太阳视运动：日期、农历与当地时间', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({width: 1600, height: 900});
  await page.goto('/');
  await page.getByRole('button', {name: '太阳视运动', exact: true}).click();
  await page.getByRole('button', {name: '观测设置'}).click();
  await expect(page.locator('.solar-stage canvas')).toBeVisible();
  await page.getByLabel('日期', {exact: true}).fill('2026-06-21');
  await expect(page.getByLabel('纬度度数')).toHaveValue('39');
  await expect(page.locator('#solar-settings .selected-lunar-date')).toHaveText('农历五月初七');
  await expect(page.locator('.solar-times')).toContainText('04:5');
  await expect(page.locator('.solar-times')).toContainText('19:4');
  await expect(page.getByTestId('solar-noon-altitude')).toHaveCount(0);
  await expect(page.locator('.timegroup')).toContainText('农历五月初七');
  await page.getByLabel(/当地时间/).fill('0');
  await expect(page.locator('.solar-lab')).toHaveAttribute('data-night', 'true');
  await page.getByLabel(/当地时间/).fill('12');
  await expect(page.locator('.solar-lab')).toHaveAttribute('data-night', 'false');
  await page.waitForTimeout(1000);
  await page.screenshot({path: 'test-results/solar-summer.png', fullPage: true});
  expect(errors).toEqual([]);
});

test('地景知识站点：拉近、数据与冬至预设', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({width: 1600, height: 900});
  await page.goto('/');
  await page.getByRole('button', {name: '太阳视运动', exact: true}).click();
  await page.getByRole('button', {name: '观测设置'}).click();
  await page.getByLabel('日期', {exact: true}).fill('2026-06-21');
  await expect(page.getByTestId('solar-stage')).toHaveAttribute('data-focus', '');
  await page.getByRole('button', {name: '① 楼间距', exact: true}).click();
  await expect(page.getByTestId('solar-stage')).toHaveAttribute('data-focus', 'spacing');
  const detail = page.getByRole('region', {name: '最小楼间距知识数据'});
  await expect(detail).toBeVisible();
  await expect(detail.getByRole('img', {name: '最小楼间距示意图'})).toContainText('47.8 m');
  await detail.screenshot({path: 'test-results/solar-spacing.png'});
  await expect(detail).toContainText('26.7°');
  await page.getByRole('button', {name: '设为冬至正午', exact: true}).click();
  await expect(page.locator('.timegroup')).toContainText('2026-12-21');
  await expect(detail).toContainText(/26\.[0-9]°/);
  await page.getByRole('button', {name: '返回全景', exact: true}).click();
  await expect(page.getByTestId('solar-stage')).toHaveAttribute('data-focus', '');
  await expect(detail).toHaveCount(0);
  await page.getByRole('button', {name: '② 热水器', exact: true}).click();
  await expect(page.getByTestId('solar-stage')).toHaveAttribute('data-focus', 'waterHeater');
  await page.getByRole('button', {name: '冬至正午', exact: true}).click();
  await expect(page.getByRole('region', {name: '太阳能热水器倾角知识数据'})).toContainText(/63\.[0-9]°/);
  await page.getByRole('button', {name: '返回全景', exact: true}).click();
  await expect(page.getByTestId('solar-stage')).toHaveAttribute('data-focus', '');
  for (const title of ['最小楼间距', '太阳能热水器倾角', '垂直物体影长', '室内采光', '遮阳板']) {
    await page.getByRole('button', {name: `查看${title}示意图`, exact: true}).click();
    await expect(page.getByRole('img', {name: `${title}示意图`, exact: true})).toBeVisible();
    await page.getByRole('button', {name: '返回全景', exact: true}).click();
  }
  expect(errors).toEqual([]);
});

test('太阳视运动：极昼极夜与城市切换', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button', {name: '太阳视运动', exact: true}).click();
  await page.getByRole('button', {name: '观测设置'}).click();
  await page.getByLabel('纬度度数').fill('80');
  await page.getByLabel('经度度数').fill('0');
  await page.getByLabel('日期', {exact: true}).fill('2026-06-21');
  await expect(page.locator('.solar-times')).toContainText('极昼');
  await expect(page.locator('.solar-summary')).toContainText('24小时00分');
  await page.getByLabel('日期', {exact: true}).fill('2026-12-21');
  await expect(page.locator('.solar-times')).toContainText('极夜');
  await page.getByLabel('典型城市').selectOption('sydney');
  await expect(page.getByLabel('经度度数')).toHaveValue('151');
  await expect(page.getByLabel('纬度度数')).toHaveValue('33');
  await expect(page.getByLabel('纬度方向')).toHaveValue('negative');
  await expect(page.getByLabel('纬度分数')).toHaveValue('52');
  await page.getByLabel('经度度数').fill('120');
  await page.getByLabel('经度分数').fill('10');
  await page.getByLabel('经度方向').selectOption('negative');
  await expect(page.getByLabel('典型城市')).toHaveValue('custom');
  await expect(page.getByLabel('经度度数')).toHaveValue('120');
  await expect(page.getByLabel('经度分数')).toHaveValue('10');
  await page.getByLabel('纬度度数').fill('90');
  await expect(page.getByLabel('纬度分数')).toHaveValue('0');

});

test('太阳视运动夜间场景', async ({page}) => {
  await page.setViewportSize({width: 1600, height: 900});
  await page.goto('/');
  await page.getByRole('button', {name: '太阳视运动', exact: true}).click();
  await page.getByRole('button', {name: '观测设置'}).click();
  await page.getByLabel('日期', {exact: true}).fill('2026-12-21');
  await page.getByLabel(/当地时间/).fill('22');
  await expect(page.locator('.solar-lab')).toHaveAttribute('data-night', 'true');
  await page.waitForTimeout(1000);
  await page.screenshot({path: 'test-results/solar-night.png', fullPage: true});
});

test('月球图层随当地时间、日期及观测点更新', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', {name: '日地月空间', exact: true})).toBeVisible();
  await page.getByRole('button', {name: '太阳视运动', exact: true}).click();
  await page.getByRole('button', {name: '观测设置'}).click();
  const time = page.getByRole('slider', {name: /当地时间/});
  const toggle = page.getByLabel('显示月球视运动');
  const position = page.getByLabel('月球位置');
  await expect(toggle).not.toBeChecked();
  await page.getByLabel('日期', {exact: true}).fill('2026-06-30');
  await toggle.check();
  await time.fill('0');
  await expect(position).toContainText('地平线上');
  await page.screenshot({path: 'test-results/solar-moon.png'});
  await time.fill('12');
  await expect(position).toContainText('地平线下');
  await page.getByLabel('典型城市').selectOption('mcmurdo');
  await expect(position).toContainText('地平线上');
  await page.getByRole('button', {name: '冬至', exact: true}).click();
  await expect(page.getByLabel('日期', {exact: true})).toHaveValue('2026-06-21');
  await time.press('End');
  await expect(time).toHaveAttribute('aria-valuetext', '00:00');
  await toggle.uncheck();
  await expect(position).toHaveCount(0);
});

test('太阳视运动窄屏无横向溢出', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/');
  await page.getByRole('button', {name: '太阳视运动', exact: true}).click();
  await expect(page.locator('.solar-stage canvas')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.waitForTimeout(800);
  await page.screenshot({path: 'test-results/solar-mobile.png', fullPage: true});
  const stage = page.getByTestId('solar-stage');
  const time = page.getByRole('slider', {name: /当地时间/});
  await expect(time).toBeVisible();
  await time.focus();
  await time.press('ArrowRight');
  await expect(time).toHaveAttribute('aria-valuetext', '12:03');
  const frame = await stage.boundingBox();
  expect(frame?.width).toBe(390);
  expect(frame?.height).toBe(844);
  await page.getByRole('button', {name: '观测设置'}).click();
  await expect(page.getByLabel('典型城市')).toBeVisible();
  await page.getByRole('button', {name: '收起面板'}).click();
  await page.getByRole('button', {name: '查看最小楼间距示意图'}).click();
  await expect(page.getByRole('img', {name: '最小楼间距示意图'})).toBeVisible();
  await page.getByRole('button', {name: '返回全景'}).click();
  await expect(page.getByRole('button', {name: '观测设置'})).toHaveAttribute('aria-expanded', 'false');
  expect(await stage.boundingBox()).toEqual(frame);
});
