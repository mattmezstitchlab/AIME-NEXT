/** L'orbe AIME : une sphère irisée qui respire. Purement visuelle ; immobile si l'on réduit les animations. */
export function Orbe({ taille = 160, className = '' }: { taille?: number; className?: string }) {
  return <span className={`x-orbe ${className}`} style={{ width: taille, height: taille }} aria-hidden="true"><i /></span>;
}
