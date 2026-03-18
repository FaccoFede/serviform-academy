"use client"

import { useState } from "react"

export default function AdminCoursesPage() {
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [softwareId, setSoftwareId] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    await fetch("http://localhost:3001/courses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title, slug, description, softwareId })
    })

    alert("Corso creato")
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Nuovo corso</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 500 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titolo corso" />
        <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="Slug corso" />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrizione" />
        <input value={softwareId} onChange={e => setSoftwareId(e.target.value)} placeholder="Software ID" />
        <button type="submit">Crea corso</button>
      </form>
    </main>
  )
}