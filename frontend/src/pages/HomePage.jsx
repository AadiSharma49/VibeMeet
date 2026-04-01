import { UserButton } from "@clerk/clerk-react"

const HomePage = () => {
  return (
    <div><UserButton/>
     <div className="home-page flex items-center justify-center h-screen bg-gradient-to-r from-purple-500 to-pink-500">
        <h1>Welcome to Vibe Meet</h1>
        </div>
        </div>
  )
}
export default HomePage 
