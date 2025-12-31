export function getProgramByFoodName(programs, foodName) {
  for (const dayPrograms of programs) {
    for (const program of dayPrograms) {
      if (program.foodName === foodName) {
        return program;
      }
    }
  }
  return null;
}
