"use client"
import * as React from "react"
import CreateForm from "./CreateForm"
import ProfilePanel from "./ProfilePanel"

export default function CreatePage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CreateForm />
        </div>
        <div className="lg:col-span-1">
          <ProfilePanel />
        </div>
      </div>
    </div>
  )
}
