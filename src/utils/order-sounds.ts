// ─────────────────────────────────────────────────────────────────────────────
// Gerenciador de sons para o módulo de pedidos
// Usa Web Audio API para gerar tons sem necessidade de arquivos de áudio
// ─────────────────────────────────────────────────────────────────────────────

class OrderSoundManager {
  private audioContext: AudioContext | null = null
  private isPlaying = false
  private currentInterval: ReturnType<typeof setInterval> | null = null
  private enabled = true

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      return this.audioContext
    } catch {
      return null
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled) this.stop()
  }

  isEnabled() {
    return this.enabled
  }

  private playTone(frequency: number, duration: number, volume: number = 0.3) {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      gain.gain.setValueAtTime(volume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)
    } catch {
      // Audio API indisponível
    }
  }

  /**
   * Alerta repetitivo para novos pedidos — toca até ser parado
   */
  playNewOrderAlert() {
    if (!this.enabled || this.isPlaying) return
    this.isPlaying = true

    const playSequence = () => {
      this.playTone(880, 0.15, 0.4)
      setTimeout(() => this.playTone(1100, 0.15, 0.4), 200)
      setTimeout(() => this.playTone(1320, 0.2, 0.4), 400)
    }

    playSequence()
    this.currentInterval = setInterval(playSequence, 3000)
  }

  /**
   * Alerta único para cancelamento — tom descendente
   */
  playCancelAlert() {
    if (!this.enabled) return
    this.playTone(440, 0.3, 0.3)
    setTimeout(() => this.playTone(330, 0.3, 0.3), 350)
    setTimeout(() => this.playTone(262, 0.5, 0.3), 700)
  }

  /**
   * Som de confirmação/sucesso — tom ascendente rápido
   */
  playSuccessSound() {
    if (!this.enabled) return
    this.playTone(523, 0.1, 0.2)
    setTimeout(() => this.playTone(659, 0.1, 0.2), 120)
    setTimeout(() => this.playTone(784, 0.15, 0.2), 240)
  }

  /**
   * Para qualquer alerta em andamento
   */
  stop() {
    this.isPlaying = false
    if (this.currentInterval) {
      clearInterval(this.currentInterval)
      this.currentInterval = null
    }
  }

  /**
   * Resume o AudioContext após interação do usuário (política do browser)
   */
  async resumeContext() {
    try {
      const ctx = this.getContext()
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume()
      }
    } catch {
      // Ignore
    }
  }
}

export const orderSoundManager = new OrderSoundManager()
