import confetti from 'canvas-confetti';

export function confettiEmoji(emoji: string, particleCount: number = 50) {
  const scalar = 2;
  const ex = confetti.shapeFromText({ text: emoji, scalar });

  const defaults = {
    spread: 360,
    ticks: 150,
    gravity: 0,
    decay: 0.96,
    startVelocity: 20,
    shapes: [ex],
    scalar,
    colors: ['#FF0000'],
  };

  const shoot = () => {
    confetti({
      ...defaults,
      particleCount: particleCount,
    });
  };

  setTimeout(shoot, 100);
}

export function confettiSideCannons() {
  const end = Date.now() + 3 * 1000; // 3 seconds
  const colors = ['#a786ff', '#fd8bbc', '#eca184', '#f8deb1'];
  const defaults = {
    particleCount: 10,
    spread: 200,
    startVelocity: 60,
    colors: colors,
  };

  const frame = () => {
    if (Date.now() > end) return;

    confetti({
      angle: 60,
      origin: { x: 0, y: 0.5 },
      ...defaults,
    });
    confetti({
      angle: 120,
      origin: { x: 1, y: 0.5 },
      ...defaults,
    });

    requestAnimationFrame(frame);
  };

  frame();
}

export function confettiFireworks() {
  const duration = 5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 200, zIndex: 0 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
}
