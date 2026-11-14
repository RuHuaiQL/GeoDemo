// Classic script so the same demo runs from file:// and from the React app.
(() => {
  const config = {
    title: { duration: 310, stagger: 25, blur: 9, rise: 5, easing: 'cubic-bezier(.22,1,.36,1)' },
    magnet: { reach: 28, offset: 5, stiffness: 210, damping: 26 },
    particles: { count: 52, size: 1.6, colors: ['#ead3a4', '#abcac3'], speed: 5, parallax: 4, driftMs: 4600 }
  };
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

  // The caller owns the accessible heading and its visible character spans.
  function reveal(heading) {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const { duration, stagger, blur, rise, easing } = config.title;
    const animations = reduced() ? [] : Array.from(heading.children, (letter, i) =>
      letter.animate([
        { opacity: 0, filter: 'blur(' + blur + 'px)', transform: 'translateY(' + rise + 'px)' },
        { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0)' }
      ], { duration, delay: i * stagger, easing, fill: 'backwards' })
    );
    const stop = () => animations.forEach(animation => animation.cancel());
    preference.addEventListener('change', stop);
    return () => { stop(); preference.removeEventListener('change', stop); };
  }

  function magnets(root) {
    const media = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const selector = 'button:not(:disabled), [role="button"]:not([aria-disabled="true"]), summary';
    const active = new Map();
    let frame = 0, last = 0, pointer = null, dirty = false;

    function selectTarget() {
      for (const state of active.values()) state.tx = state.ty = 0;
      if (!pointer) return;
      const {reach, offset} = config.magnet;
      const hit = pointer.target.closest(selector);
      const candidates = hit && root.contains(hit) ? [hit] : root.querySelectorAll(selector);
      let best = Infinity, selected = null, tx = 0, ty = 0;
      for (const button of candidates) {
        const rect = button.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        const state = active.get(button);
        const dx = pointer.x - rect.left - rect.width / 2 + (state?.x || 0);
        const dy = pointer.y - rect.top - rect.height / 2 + (state?.y || 0);
        const gap = Math.hypot(Math.max(0, Math.abs(dx)-rect.width/2), Math.max(0, Math.abs(dy)-rect.height/2));
        const distance = Math.hypot(dx,dy);
        if (gap >= reach || distance >= best) continue;
        best = distance; selected = button;
        const pull = Math.min(.3, offset / (distance || 1)) * (1-gap/reach);
        tx = dx*pull; ty = dy*pull;
      }
      if (selected) {
        if (!active.has(selected)) active.set(selected, {x:0,y:0,vx:0,vy:0,tx:0,ty:0});
        const state = active.get(selected);
        state.tx = tx; state.ty = ty;
      }
    }
    function tick(now) {
      if (dirty) {selectTarget(); dirty = false;}
      const dt = Math.min((now-last)/1000, 1/30);
      const {stiffness,damping} = config.magnet;
      last = now;
      let moving = false;
      for (const [button,s] of active) {
        if (!button.isConnected) {active.delete(button); continue;}
        s.vx += ((s.tx-s.x)*stiffness - s.vx*damping)*dt;
        s.vy += ((s.ty-s.y)*stiffness - s.vy*damping)*dt;
        s.x += s.vx*dt; s.y += s.vy*dt;
        if (Math.hypot(s.x-s.tx,s.y-s.ty,s.vx,s.vy) < .04) {
          s.x = s.tx; s.y = s.ty; s.vx = s.vy = 0;
          if (!s.tx && !s.ty) {button.style.removeProperty('translate'); active.delete(button); continue;}
        } else moving = true;
        button.style.translate = s.x+'px '+s.y+'px';
      }
      frame = moving ? requestAnimationFrame(tick) : 0;
    }
    function update(event) {
      if (!media.matches || event.pointerType === 'touch') return;
      pointer = event.type === 'pointerleave' ? null : {x:event.clientX, y:event.clientY, target:event.target};
      dirty = true;
      if (!frame) {last = performance.now(); frame = requestAnimationFrame(tick);}
    }
    function reset() {
      cancelAnimationFrame(frame); frame = 0; pointer = null; dirty = false;
      for (const button of active.keys()) button.style.removeProperty('translate');
      active.clear();
    }
    root.addEventListener('pointermove',update);
    root.addEventListener('pointerleave',update);
    root.addEventListener('keydown',reset);
    window.addEventListener('blur',reset);
    media.addEventListener('change',reset);
    return () => {
      reset();
      root.removeEventListener('pointermove',update);
      root.removeEventListener('pointerleave',update);
      root.removeEventListener('keydown',reset);
      window.removeEventListener('blur',reset);
      media.removeEventListener('change',reset);
    };
  }

  function particles(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};
    const s = config.particles;
    const dots = Array.from({ length: s.count }, () => ({
      x: Math.random(), y: Math.random(), depth: 0.25 + Math.random() * 0.75
    }));
    const host = canvas.parentElement;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let w = 0, h = 0, frame = 0, last = 0, elapsed = 0, visible = false;
    let x = 0, y = 0, targetX = 0, targetY = 0;
    function paint(now) {
      frame = 0;
      if (!visible || document.hidden) { last = 0; return; }
      const dt = last ? Math.min(now - last, 50) : 16;
      last = now;
      if (!reduced()) elapsed = Math.min(s.driftMs, elapsed + dt);
      const follow = 1 - Math.exp(-dt / 100);
      x += (targetX - x) * follow; y += (targetY - y) * follow;
      ctx.clearRect(0, 0, w, h);
      // Keep a similar density on a narrow phone header and a full demo panel.
      const count = Math.min(dots.length, Math.max(8, Math.ceil(w * h / 2300)));
      for (let i = 0; i < count; i++) {
        const d = dots[i];
        const px = (d.x * w + (elapsed / 1000 * s.speed + x) * d.depth + w) % w;
        const py = (d.y * h + y * d.depth + h) % h;
        ctx.fillStyle = s.colors[i % s.colors.length];
        ctx.globalAlpha = 0.2 + d.depth * 0.45;
        ctx.beginPath(); ctx.arc(px, py, s.size * d.depth, 0, 2 * Math.PI); ctx.fill();
      }
      if (!reduced() && (elapsed < s.driftMs || Math.hypot(x - targetX, y - targetY) > 0.05))
        frame = requestAnimationFrame(paint);
      else last = 0;
    }
    function wake() {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(paint);
    }
    function resize() {
      w = Math.max(1, canvas.clientWidth); h = Math.max(1, canvas.clientHeight);
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); wake();
    }
    function pointer(event) {
      if (reduced() || !fine() || event.pointerType === 'touch') return;
      const rect = canvas.getBoundingClientRect();
      targetX = event.type === 'pointerleave' ? 0 : ((event.clientX - rect.left) / w - 0.5) * s.parallax;
      targetY = event.type === 'pointerleave' ? 0 : ((event.clientY - rect.top) / h - 0.5) * s.parallax;
      wake();
    }
    function refresh() {
      cancelAnimationFrame(frame); frame = last = 0;
      if (reduced()) x = y = targetX = targetY = 0;
      wake();
    }
    const size = new ResizeObserver(resize);
    const view = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; refresh(); });
    size.observe(canvas); view.observe(canvas);
    host.addEventListener('pointermove', pointer); host.addEventListener('pointerleave', pointer);
    preference.addEventListener('change', refresh); document.addEventListener('visibilitychange', refresh);
    resize();
    return () => {
      cancelAnimationFrame(frame); size.disconnect(); view.disconnect();
      host.removeEventListener('pointermove', pointer); host.removeEventListener('pointerleave', pointer);
      preference.removeEventListener('change', refresh); document.removeEventListener('visibilitychange', refresh);
    };
  }
  window.GeoMotion = { config, reveal, magnets, particles };
})();
