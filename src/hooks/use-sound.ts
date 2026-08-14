"use client";

import {
  soundManager,
  type SoundBundle,
  type SoundName,
} from "@/lib/sound";
import { useCallback, useEffect, useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => soundManager.subscribe(cb);

/**
 * Acesso à identidade sonora dentro de componentes.
 *
 * `preload` recebe o pacote do papel da tela ("customer", "restaurant",
 * "courier") e deixa os arquivos prontos ao montar — sem isso o primeiro som
 * de cada sessão sai atrasado, justo o que mais importa acertar.
 */
export function useSound(preload?: SoundBundle | SoundName[]) {
  const muted = useSyncExternalStore(
    subscribe,
    () => soundManager.isMuted(),
    // No servidor não há preferência gravada; o valor real entra na hidratação.
    () => false,
  );

  const volume = useSyncExternalStore(
    subscribe,
    () => soundManager.getVolume(),
    () => 1,
  );

  useEffect(() => {
    if (preload) soundManager.preload(preload);
    // Pacotes são constantes do manifest; comparar por referência basta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = useCallback(
    (name: SoundName, options?: { gain?: number }) =>
      soundManager.play(name, options),
    [],
  );

  const loop = useCallback(
    (name: SoundName, intervalMs?: number) =>
      soundManager.loop(name, intervalMs),
    [],
  );

  const stopLoop = useCallback(
    (name: SoundName) => soundManager.stopLoop(name),
    [],
  );

  const toggleMuted = useCallback(() => soundManager.toggleMuted(), []);

  const setMuted = useCallback(
    (value: boolean) => soundManager.setMuted(value),
    [],
  );

  const setVolume = useCallback(
    (value: number) => soundManager.setVolume(value),
    [],
  );

  /**
   * Chame junto de um clique que antecede um som disparado por polling — o
   * caso clássico é finalizar o pedido antes de a tela de acompanhamento
   * começar a tocar sozinha.
   */
  const unlock = useCallback(() => soundManager.unlock(), []);

  return {
    play,
    loop,
    stopLoop,
    unlock,
    muted,
    setMuted,
    toggleMuted,
    volume,
    setVolume,
  };
}
