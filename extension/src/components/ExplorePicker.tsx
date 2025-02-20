import React from 'react'
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material'

interface ExploreOption {
  modelName: string
  exploreId: string
  exploreKey: string
}

interface ExplorePickerProps {
  explores: ExploreOption[]
  currentExploreKey: string
  onChange: (event: SelectChangeEvent) => void
}

const toCamelCase = (input: string): string => {
  // Remove underscores, make following letter uppercase
  let result = input.replace(/_([a-z])/g, (_match, letter) => ' ' + letter.toUpperCase())
  // Capitalize the first letter of the string
  result = result.charAt(0).toUpperCase() + result.slice(1)
  return result
}

const ExplorePicker: React.FC<ExplorePickerProps> = ({ explores, currentExploreKey, onChange }) => {
  // Group explores by model
  const groupedExplores = explores.reduce((acc, explore) => {
    if (!acc[explore.modelName]) {
      acc[explore.modelName] = []
    }
    acc[explore.modelName].push(explore)
    return acc
  }, {} as Record<string, ExploreOption[]>)

  // Sort model names alphabetically
  const sortedModelNames = Object.keys(groupedExplores).sort()

  return (
    <FormControl fullWidth>
      <InputLabel>Explore</InputLabel>
      <Select
        value={currentExploreKey}
        label="Explore"
        onChange={onChange}
      >
        {sortedModelNames.map((modelName) => [
          <MenuItem key={modelName} disabled sx={{ opacity: 0.7, fontWeight: 'bold' }}>
            {toCamelCase(modelName)}
          </MenuItem>,
          ...groupedExplores[modelName].map((explore) => (
            <MenuItem 
              key={explore.exploreKey} 
              value={explore.exploreKey}
              sx={{ pl: 4 }} // Indent explores under their model
            >
              {toCamelCase(explore.exploreId)}
            </MenuItem>
          ))
        ])}
      </Select>
    </FormControl>
  )
}

export default ExplorePicker 