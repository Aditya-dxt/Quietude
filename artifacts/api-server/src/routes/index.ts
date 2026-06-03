import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import postsRouter from "./posts";
import repliesRouter from "./replies";
import connectionsRouter from "./connections";
import messagesRouter from "./messages";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(postsRouter);
router.use(repliesRouter);
router.use(connectionsRouter);
router.use(messagesRouter);
router.use(uploadRouter);

export default router;
