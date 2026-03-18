"use client"

import { useState } from "react"

export default function AdminUnitsPage() {
  const [title, setTitle] = useState("")
  const [order, setOrder] = useState(1)
  const [courseId, setCourseId] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    await fetch("http://localhost:3001/units", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title, order, courseId })
    })

    alert("Unit creata")
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Nuova unit</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 500 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titolo unit" />
        <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} placeholder="Ordine" />
        <input value={courseId} onChange={e => setCourseId(e.target.value)} placeholder="Course ID" />
        <button type="submit">Crea unit</button>
      </form>
    </main>
  )
}