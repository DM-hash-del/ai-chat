import { useState, useEffect } from 'react'
import './App.css'
import api from './lib/api'

function App() {
    const [res, setRes] = useState()
    const [error, setError] = useState()
    useEffect(() => {
        api.get('/api/ping')
            .then((data) => setRes(data.data))
            .catch((err) => setError(err))
    }, [])

    const num = 0

    return (
        <div>
            {error ? (
                <p>Error: {JSON.stringify(error)}</p>
            ) : res ? (
                <p>{JSON.stringify(res)}</p>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    )
}

export default App
