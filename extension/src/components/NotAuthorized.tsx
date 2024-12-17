import React from 'react'

export const NotAuthorized = () => {
  return (
    <div className="flex justify-center items-center h-screen w-full">
      <div className="flex flex-col space-y-4 mx-auto max-w-xl p-4">
        <h1 className="text-5xl font-bold">
          <span className="bg-clip-text text-transparent  bg-gradient-to-r from-pink-500 to-violet-500">
            Uh ohh.
          </span>
        </h1>
        <h1 className="text-3xl text-gray-400">You are not authorized to access this experience</h1>
      </div>
    </div>
  )
}
