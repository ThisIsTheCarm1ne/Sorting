import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ItemList from "./components/ItemList.tsx";

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <ItemList />
    </>
  )
}

export default App
