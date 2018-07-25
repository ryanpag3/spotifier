# spotifier.io (v2)
Hello, 

Welcome to the v2 branch. If you would like the current build, please refer to master or development.

I have decided to take another look at this project in order to bring it to scale. Spotify has recently disabled new release notifications (email, push) leading to increased demand for this service. 

Due to the fact that I built spotifier.io while largely learning how to build web applications I failed to architect it in a scalable and efficient way. Instead of rewriting, I have decided to make the following enhancements to lead to a 2.0 architecture and release.

1. Offload processing to job-handler service using message queues.
2. Improve API request scaling.
3. Redesign UI and include native mobile support.

Progress is ongoing. Please hit me up if you are interested in contributing!