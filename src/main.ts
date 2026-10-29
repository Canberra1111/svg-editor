import { ShapeFactory } from './application/ShapeFactory.js';
import { SvgCodec } from './infrastructure/SvgCodec.js';
import { FileDocumentStore } from './infrastructure/FileDocumentStore.js';
import { Session } from './application/Session.js';
import { CommandRegistry } from './application/CommandRegistry.js';
import { CommandRunner } from './application/CommandRunner.js';
import { LineProcessor } from './cli/LineProcessor.js';
import { Terminal } from './cli/Terminal.js';

const factory = new ShapeFactory();
const storage = new FileDocumentStore(new SvgCodec(factory));
const session = new Session(storage);
const commands = new CommandRunner(session, new CommandRegistry(factory));
await new Terminal(new LineProcessor(commands)).start();
