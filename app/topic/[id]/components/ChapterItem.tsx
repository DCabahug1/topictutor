'use client'
import React from 'react'
import { Chapter } from '@/lib/models'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

function ChapterItem({ chapter, index }: { chapter: Chapter, index: number }) {
  return (
    <Card className='gap-2 hover:bg-black/10 transition-colors duration-100 cursor-pointer'>
      <CardHeader className=''>
        <h2 className='text-lg font-semibold'>{index + 1}. {chapter.title}</h2>
      </CardHeader>
      <CardContent>
        <p className='text-muted-foreground'>{chapter.description}</p>
      </CardContent>
    </Card>
  )
}

export default ChapterItem