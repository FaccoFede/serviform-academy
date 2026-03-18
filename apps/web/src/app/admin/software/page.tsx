"use client"

import { useState } from "react"

export default function AdminSoftwarePage() {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    await fetch("http://localhost:3001/software", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, slug })
    })

    alert("Software creato")
    setName("")
    setSlug("")
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Nuovo software</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome software" />
        <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="Slug" />
        <button type="submit">Crea software</button>
      </form>
    </main>
  )
}