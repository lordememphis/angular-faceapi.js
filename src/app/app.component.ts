import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

import * as faceapi from 'src/assets/face-api.min.js';

@Component({
  selector: 'app-root',
  template: `
    <video
      #video
      width="720"
      height="720"
      autoplay
      muted
      [srcObject]="stream"
    ></video>
  `,
})
export class AppComponent implements AfterViewInit {
  video: HTMLVideoElement;
  @ViewChild('video') set v(e: ElementRef) {
    this.video = e.nativeElement;
  }
  stream: MediaStream;

  ngAfterViewInit() {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('assets/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('assets/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('assets/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('assets/models'),
    ]).then(() =>
      navigator.mediaDevices.getUserMedia({ video: true }).then(
        (stream: MediaStream) => {
          this.stream = stream;
        },
        (e) => console.error(e)
      )
    );

    this.video.play().then(() => {
      const canvas = faceapi.createCanvasFromMedia(this.video);
      document.body.append(canvas);
      const displaySize = {
        width: this.video.width,
        height: this.video.height,
      };
      faceapi.matchDimensions(canvas, displaySize);
      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();
        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      }, 100);
    });
  }
}
