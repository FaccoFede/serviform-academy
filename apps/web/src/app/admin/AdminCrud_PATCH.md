// PATCH da applicare a apps/web/src/components/features/AdminCrud.tsx
//
// Il componente AdminCrud attuale non supporta:
// 1. type: 'custom' nei formFields (per VideoSelector e GuidesEditor)
// 2. callback onEdit per precaricare dati prima di aprire il form
//
// Aggiungi queste due modifiche:
//
// --- MODIFICA 1: aggiungere onEdit alle props ---
// Nella definizione Props aggiungi:
//   onEdit?: (item: any) => void | Promise<void>
//
// --- MODIFICA 2: chiamare onEdit quando si apre il form di modifica ---
// Nella funzione che apre il form per modificare un item esistente, aggiungi:
//   if (onEdit) await onEdit(item)
//
// --- MODIFICA 3: supportare type: 'custom' nel render dei campi ---
// Nel render di ogni campo del form, aggiungi questo caso:
//
//   if (field.type === 'custom' && field.customRender) {
//     return (
//       <div key={field.key} className={styles.field}>
//         <label className={styles.label}>{field.label}</label>
//         {field.customRender()}
//       </div>
//     )
//   }
//
// --- MODIFICA 4: aggiungere customRender all'interfaccia FormField ---
// Nell'interfaccia FormField aggiungi:
//   customRender?: () => React.ReactNode
//
// Queste modifiche sono minimali e non rompono nessun comportamento esistente.
// Il componente continua a funzionare identicamente per tutti i field normali.
