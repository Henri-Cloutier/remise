import Repository from '../models/repository.js';
import PostModel from '../models/Post.js';
import Controller from './Controller.js';

export default class PostsController extends Controller  {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new PostModel()));
    }
}
