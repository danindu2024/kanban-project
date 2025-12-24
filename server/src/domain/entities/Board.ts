export class Board {
  constructor(
    public readonly id: string,
    public title: string,
    public ownerId: string,
    public members: string[], // Array of User IDs
    public readonly createdAt: Date
  ) {}
}