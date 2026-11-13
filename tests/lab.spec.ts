import {test,expect} from '@playwright/test';

test('农历日期、三维资源与月相预览',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  const loaded=['earth','sun'].map(name=>page.waitForResponse(r=>r.url().endsWith(`/models/${name}.glb`) && r.ok()));
  await page.goto('/');
  await Promise.all(loaded);
  const date=page.getByRole('slider',{name:/农历/});
  await expect(date).toHaveValue('1');
  const moon=page.getByTestId('phase-view');
  await expect(moon).toContainText('新月');
  await expect(moon).not.toContainText('%');
  await expect(page.getByLabel('地方太阳时')).toHaveCount(0);
  await page.getByRole('button',{name:'满月',exact:true}).click();
  await expect(date).toHaveAttribute('aria-valuetext','农历十五');
  await expect(moon).toHaveAttribute('data-illumination','1');
  await page.getByRole('button',{name:'隐藏月相'}).click();
  await expect(moon).toHaveCount(0);
  await page.getByRole('button',{name:'显示月相'}).click();
  await expect(moon).toContainText('满月');
  await page.getByRole('button',{name:'北极俯视'}).click();
  await expect(page.getByRole('button',{name:'倾斜观察'})).toBeVisible();
  expect(errors).toEqual([]);
});

test('月相图八个位置与升落时刻联动',async({page})=>{
  await page.setViewportSize({width:1600,height:900});
  await page.goto('/');
  await page.getByRole('button',{name:/一月月相图/}).click();
  const stops=page.locator('.atlas-stop');
  await expect(stops).toHaveCount(8);
  for(let i=0;i<8;i++) {
    await stops.nth(i).click();
    await expect(stops.nth(i)).toHaveAttribute('aria-pressed','true');
    await expect(page.getByTestId('phase-view')).toContainText(['新月','娥眉月','上弦月','盈凸月','满月','亏凸月','下弦月','残月'][i]);
  }
  await page.getByRole('button',{name:/定位到上弦月/}).click();
  await page.screenshot({path:'test-results/lunar-atlas.png'});
  await page.getByRole('button',{name:/一月月相图/}).click();
  await page.getByRole('button',{name:/月出、中天与月落/}).click();
  const times=page.locator('.lunar-events dd');
  await expect(times).toHaveText(['12:00','18:00','次日 00:00']);
  await expect(page.locator('section.lunar-events')).toContainText('以东约 90°');
  await page.getByRole('button',{name:'满月',exact:true}).click();
  await expect(times).toHaveText(['18:00','次日 00:00','次日 06:00']);
  await page.screenshot({path:'test-results/lunar-events.png'});
  await page.getByText('八种典型月相时刻对照').click();
  await expect(page.locator('.lunar-events tbody tr')).toHaveCount(8);
});

test('朔望月播放、选择日期停止和重置',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'播放朔望月'}).click();
  const date=page.getByRole('slider',{name:/农历/});
  await expect.poll(async()=>Number(await date.inputValue())).toBeGreaterThan(1);
  await date.fill('23');
  await expect(page.getByRole('button',{name:'播放朔望月'})).toBeVisible();
  await expect(date).toHaveAttribute('aria-valuetext','农历廿三');
  await page.getByRole('button',{name:'重置',exact:true}).click();
  await expect(date).toHaveAttribute('aria-valuetext','农历初一');
});

for(const size of [{width:1366,height:768},{width:390,height:844}])test(`月相操作与键盘 ${size.width}`,async({page})=>{
  await page.setViewportSize(size);
  await page.goto('/');
  const date=page.getByRole('slider',{name:/农历/});
  await date.focus();await page.keyboard.press('ArrowRight');
  await expect(date).toHaveAttribute('aria-valuetext','农历初二');
  await page.getByRole('button',{name:/一月月相图/}).click();
  await page.getByRole('button',{name:/定位到满月/}).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('phase-view')).toContainText('满月');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.getByRole('button',{name:'重置',exact:true})).toBeInViewport();
});
