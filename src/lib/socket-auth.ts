/**
 * Provider de auth pro socket.io-client. Passar isso (em vez de um objeto
 * `{ token }` estático) faz o cliente buscar um token FRESCO a cada
 * tentativa de conexão - inclusive as reconexões automáticas internas do
 * socket.io, que antes reenviavam pra sempre o token capturado na primeira
 * conexão e travavam em loop de erro depois que ele expirava.
 */
export function socketAuthProvider(
  callback: (data: { token: string | null }) => void,
) {
  fetch("/api/auth/socket-token")
    .then((res) => res.json())
    .then(({ token }: { token: string | null }) => callback({ token }))
    .catch(() => callback({ token: null }));
}
