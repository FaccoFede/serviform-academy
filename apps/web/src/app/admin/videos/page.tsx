"use client"

import { useState } from "react"

export default function AdminVideosPage() {
  const [title, setTitle] = useState("")
  const [youtubeId, setYoutubeId] = useState("")
  const [softwareId, setSoftwareId] = useState("")
  const [description, setDescription] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    await fetch("http://localhost:3001/videos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title, youtubeId, softwareId, description })
    })

    alert("Video pillola creata")
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Nuova video pillola</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 500 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titolo video" />
        <input value={youtubeId} onChange={e => setYoutubeId(e.target.value)} placeholder="YouTube ID" />
        <input value={softwareId} onChange={e => setSoftwareId(e.target.value)} placeholder="Software ID" />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrizione" />
        <button type="submit">Crea video pillola</button>
      </form>
    </main>
  )
}