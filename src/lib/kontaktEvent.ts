// Kleiner Umweg statt Prop-Durchreichung: Ein Button irgendwo auf der Seite
// legt eine Nachricht ins Kontaktformular und springt dorthin.

const NAME = 'kontakt-vorbelegen'

export function kontaktVorbelegen(nachricht: string): void {
  window.dispatchEvent(new CustomEvent<string>(NAME, { detail: nachricht }))
  document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function aufKontaktVorbelegen(handler: (nachricht: string) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<string>).detail)
  window.addEventListener(NAME, listener)
  return () => window.removeEventListener(NAME, listener)
}
