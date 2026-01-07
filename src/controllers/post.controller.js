const { Post, Comment } = require('../models/post.model');

exports.addComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { author, content, parentCommentId } = req.body;

        if (!author || !content) {
            return res.status(400).json({ message: 'Author and content are required' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (parentCommentId) {
            const parentComment = await Comment.findOne({
                _id: parentCommentId,
                postId: postId
            });
            if (!parentComment) {
                return res.status(404).json({ message: 'Parent comment not found' });
            }
        }

        const comment = new Comment({
            postId,
            author,
            content,
            parentCommentId: parentCommentId || null
        });

        const savedComment = await comment.save();
        
        await savedComment.populate('author', 'username');

        res.status(201).json({
            message: parentCommentId ? 'Reply added successfully' : 'Comment added successfully',
            comment: savedComment
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ 
            message: 'Error adding comment', 
            error: error.message 
        });
    }
};


exports.getPostComments = async (req, res) => {
    try {
        const { postId } = req.params;
        
        const comments = await Comment.find({ 
            postId,
            parentCommentId: null 
        }).sort({ createdAt: -1 });

        const getNestedComments = async (parentId) => {
            const replies = await Comment.find({ parentCommentId: parentId })
                .sort({ createdAt: 1 });
            const repliesObj = [];
            for (let reply of replies) {
                let replyObj = reply.toObject();
                replyObj.replies = await getNestedComments(reply._id);
                repliesObj.push(replyObj);
            }
            
            return repliesObj;
        };

        const commentsWithReplies = [];
        for (let comment of comments) {
            const commentObj = comment.toObject();
            commentObj.replies = await getNestedComments(comment._id);
            commentsWithReplies.push(commentObj);
        }

        res.json(commentsWithReplies);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ 
            message: 'Error fetching comments', 
            error: error.message 
        });
    }
};

exports.createPost = async (req, res) => {
    try {
        const { author, title, content } = req.body;
        
        if (!author || !title || !content) {
            return res.status(400).json({ 
                message: 'Author, title, and content are required' 
            });
        }

        const post = new Post({
            author,
            title,
            content
        });

        const savedPost = await post.save();
        res.status(201).json(savedPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ 
            message: 'Error creating post', 
            error: error.message 
        });
    }
};

exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        
        const postsWithCommentCount = await Promise.all(
            posts.map(async (post) => {
                const commentCount = await Comment.countDocuments({ 
                    postId: post._id 
                });
                return {
                    ...post.toObject(),
                    commentCount
                };
            })
        );

        res.json(postsWithCommentCount);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ 
            message: 'Error fetching posts', 
            error: error.message 
        });
    }
};


