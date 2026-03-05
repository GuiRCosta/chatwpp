let shuttingDown = false

export function setShuttingDown(): void {
  shuttingDown = true
}

export function isShuttingDown(): boolean {
  return shuttingDown
}
