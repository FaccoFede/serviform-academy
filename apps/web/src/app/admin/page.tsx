export default function AdminPage() {
  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Serviform Academy</h1>

      <ul style={{ marginTop: 20, lineHeight: 2 }}>
        <li><a href="/admin/software">Gestione software</a></li>
        <li><a href="/admin/courses">Gestione corsi</a></li>
        <li><a href="/admin/units">Gestione unità</a></li>
        <li><a href="/admin/videos">Gestione video pillole</a></li>
      </ul>
    </main>
  )
}