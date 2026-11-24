import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { audioService } from '../src/services/audioService.js';

describe('Web Server Audio Service & Media Ingestion Suite', () => {
  const fixturesDir = path.resolve(process.cwd(), '../../Minomeet/tests/fixtures');

  it('correctly identifies video extensions vs audio extensions', () => {
    assert.strictEqual(audioService.isVideoFile('recording.mp4'), true);
    assert.strictEqual(audioService.isVideoFile('recording.mov'), true);
    assert.strictEqual(audioService.isVideoFile('recording.mkv'), true);
    assert.strictEqual(audioService.isVideoFile('recording.mp3'), false);
    assert.strictEqual(audioService.isVideoFile('recording.wav'), false);
    assert.strictEqual(audioService.isVideoFile('recording.m4a'), false);
  });

  it('detects audio stream in video with audio and absence in video without audio', async () => {
    if (!fs.existsSync(fixturesDir)) return;

    const withAudio = path.join(fixturesDir, 'test_5s.mp4');
    const withoutAudio = path.join(fixturesDir, 'test_no_audio.mp4');

    if (fs.existsSync(withAudio)) {
      const hasAudio = await audioService.hasAudioStream(withAudio);
      assert.strictEqual(hasAudio, true, 'test_5s.mp4 should have an audio stream');
    }

    if (fs.existsSync(withoutAudio)) {
      const hasAudio = await audioService.hasAudioStream(withoutAudio);
      assert.strictEqual(hasAudio, false, 'test_no_audio.mp4 should NOT have an audio stream');
    }
  });

  it('extractAudioFromVideo extracts 16kHz audio from valid video file', async () => {
    if (!fs.existsSync(fixturesDir)) return;

    const withAudio = path.join(fixturesDir, 'test_5s.mp4');
    if (!fs.existsSync(withAudio)) return;

    const extracted = await audioService.extractAudioFromVideo(withAudio);
    assert.ok(fs.existsSync(extracted), 'Extracted audio file should exist on disk');
    assert.ok(fs.statSync(extracted).size > 1000, 'Extracted audio file size should be > 1000 bytes');
  });

  it('extractAudioFromVideo throws clear error when video has no audio track', async () => {
    if (!fs.existsSync(fixturesDir)) return;

    const withoutAudio = path.join(fixturesDir, 'test_no_audio.mp4');
    if (!fs.existsSync(withoutAudio)) return;

    await assert.rejects(
      async () => {
        await audioService.extractAudioFromVideo(withoutAudio);
      },
      /This video has no audio track/,
      'Should reject with "This video has no audio track"'
    );
  });
});
