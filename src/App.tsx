import { useState } from 'react'
import { uploadData } from 'aws-amplify/storage'
import './App.css'

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<string>('')
  const [apiResult, setApiResult] = useState<string>('')

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadResult('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setUploadResult('')

    try {
      const result = await uploadData({
        path: `images/${Date.now()}-${selectedFile.name}`,
        data: selectedFile,
        options: {
          contentType: selectedFile.type,
        }
      }).result

      setUploadResult(`Successfully uploaded: ${result.path}`)
    } catch (error) {
      console.error('Error uploading file:', error)
      setUploadResult(`Error: ${error instanceof Error ? error.message : 'Upload failed'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleApiCall = async () => {
    setApiResult('Loading...')

    try {
      // Example: Call a public API (JSONPlaceholder)
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1')
      const data = await response.json()

      setApiResult(`API Response: ${data.title}`)
    } catch (error) {
      console.error('Error calling API:', error)
      setApiResult(`Error: ${error instanceof Error ? error.message : 'API call failed'}`)
    }
  }

  return (
    <div className="App">
      <h1>Recreaite</h1>
      <p>React + AWS Amplify Demo</p>

      <div className="card">
        <h2>Upload Image to S3</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        {selectedFile && (
          <p>Selected: {selectedFile.name}</p>
        )}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload to S3'}
        </button>
        {uploadResult && (
          <p className={uploadResult.includes('Error') ? 'error' : 'success'}>
            {uploadResult}
          </p>
        )}
      </div>

      <div className="card">
        <h2>External API Call</h2>
        <button onClick={handleApiCall}>
          Call Sample API
        </button>
        {apiResult && (
          <p className="api-result">{apiResult}</p>
        )}
      </div>
    </div>
  )
}

export default App
