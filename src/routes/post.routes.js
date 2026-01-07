const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');

router.post('/', postController.createPost);
router.get('/', postController.getAllPosts);

router.post('/:postId/comments', postController.addComment);
router.get('/:postId/comments', postController.getPostComments);

module.exports = router;
