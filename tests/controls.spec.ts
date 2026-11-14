import {test,expect} from '@playwright/test';

test('底部速度菜单向上展开，键盘确认和取消选择',async({page})=>{
  await page.goto('/');
  const trigger=page.getByRole('combobox',{name:'播放速度'});
  await trigger.press('Enter');
  const list=page.getByRole('listbox',{name:'播放速度'});
  await expect(list).toBeInViewport();
  expect((await list.boundingBox())!.y).toBeLessThan((await trigger.boundingBox())!.y);
  await trigger.press('End');await trigger.press('Enter');
  await expect(trigger).toHaveText('2×');
  await trigger.press('ArrowUp');await trigger.press('Escape');
  await expect(list).toHaveCount(0);await expect(trigger).toHaveText('2×');
});

test.describe('手机菜单',()=>{
  test.use({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  test('触摸选择城市并拖动底部时间轴',async({page})=>{
    await page.goto('/');
    await page.getByRole('button',{name:'太阳视运动',exact:true}).tap();
    await page.getByRole('button',{name:'观测设置'}).tap();
    const city=page.getByRole('combobox',{name:'典型城市'});
    await city.tap();
    await page.getByRole('option',{name:/悉尼/}).tap();
    await expect(city).toContainText('悉尼');
    const time=page.getByRole('slider',{name:/当地时间/});
    expect((await time.boundingBox())!.y).toBeGreaterThan(700);
    await time.fill('8');
    await expect(time).toHaveAttribute('aria-valuetext','08:00');
  });
});
