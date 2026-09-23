export function randomTargetPosition(area, target) {
  const padding = 12, width = Math.max(1, area.clientWidth - target.offsetWidth - padding * 2), height = Math.max(1, area.clientHeight - target.offsetHeight - padding * 2);
  return { left: padding + Math.random() * width, top: padding + Math.random() * height };
}
