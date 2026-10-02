export function canEnrollPasskey(existingPeople) {
  return Number.isInteger(existingPeople) && existingPeople >= 0 && existingPeople < 2;
}
