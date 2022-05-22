class StoryItemDto {
    id
    ownerId
    ownerName
    title
    dateCreated
    tags
    category
    likes
    commentCount
    thumb
    bodyPreview
    timeToRead

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
        this.thumb = story.thumb
        this.bodyPreview = story.bodyPreview
        this.timeToRead = story.timeToRead
    }



}

export default StoryItemDto