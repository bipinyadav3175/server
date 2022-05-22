class StoryDto {
    id
    ownerId
    ownerName
    title
    dateCreated
    tags
    category
    likes
    commentCount
    data

    constructor(story) {
        this.id = story.id
        this.ownerId = story.ownerId
        this.ownerName = story.ownerName
        this.title = story.title
        this.dateCreated = story.dateCreated
        this.tags = story.tags
        this.category = story.category
        this.likes = story.likes
        this.commentCount = story.commentCount
        this.data = story.data
    }



}

export default StoryDto