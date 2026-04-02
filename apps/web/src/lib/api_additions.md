// Aggiornamenti da applicare a apps/web/src/lib/api.ts
// Aggiungere questi endpoint al file esistente:

// Nel blocco `certificates`:
//   my: () => request<any[]>('/certificates/my'),

// Aggiungere nuovo blocco `uploads`:
//   uploads: {
//     image: (file: File, token: string) => {
//       const fd = new FormData()
//       fd.append('file', file)
//       return fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/uploads/image', {
//         method: 'POST',
//         headers: { Authorization: 'Bearer ' + token },
//         body: fd,
//       }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(new Error(e.message))))
//     },
//   },

// Aggiungere thumbnailUrl all'interfaccia Course:
//   export interface Course {
//     id: string; title: string; slug: string; description?: string;
//     level?: string; duration?: string; available: boolean;
//     publishState?: string; thumbnailUrl?: string;
//     software?: Software; units?: Unit[]
//   }
