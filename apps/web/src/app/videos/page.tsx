async function getVideos() {

  const res = await fetch("http://localhost:3001/videos", {
    cache: "no-store"
  })

  return res.json()

}

export default async function VideosPage() {

  const videos = await getVideos()

  return (

    <main style={{ padding: "40px" }}>

      <h1>Video Pillole</h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: "30px",
        marginTop: "30px"
      }}>

        {videos.map((video: any) => (

          <div key={video.id}>

            <iframe
              width="100%"
              height="200"
              src={`https://www.youtube.com/embed/${video.youtubeId}`}
            />

            <h3>{video.title}</h3>

          </div>

        ))}

      </div>

    </main>

  )

}