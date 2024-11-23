<template>
  <div class="swap-progress" v-if="isLoggedIn">
    <h3>Swap Progress</h3>
    <div class="progress-container">
      <div class="progress-step" :class="{ active: step >= 1, completed: step > 1 }">
        <div class="step-number">1</div>
        <div class="step-label">Initiating Swap</div>
      </div>
      <div class="progress-step" :class="{ active: step >= 2, completed: step > 2 }">
        <div class="step-number">2</div>
        <div class="step-label">Processing</div>
      </div>
      <div class="progress-step" :class="{ active: step >= 3, completed: step > 3 }">
        <div class="step-number">3</div>
        <div class="step-label">Completed</div>
      </div>
    </div>
    <div class="status-message">{{ statusMessage }}</div>
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';

const props = defineProps({
  isLoggedIn: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['swapComplete']);

const step = ref(0);
const statusMessage = ref('');
const error = ref('');

const updateProgress = (newStep, message) => {
  step.value = newStep;
  statusMessage.value = message;
};

const setError = (errorMessage) => {
  error.value = errorMessage;
};

defineExpose({
  updateProgress,
  setError
});
</script>

<style scoped>
.swap-progress {
  margin: 20px;
  padding: 20px;
  border-radius: 8px;
  background: #f8f9fa;
}

.progress-container {
  display: flex;
  justify-content: space-between;
  margin: 20px 0;
  position: relative;
}

.progress-container::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: #e9ecef;
  z-index: 1;
}

.progress-step {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.progress-step.active .step-number {
  background: #007bff;
  color: white;
}

.progress-step.completed .step-number {
  background: #28a745;
  color: white;
}

.status-message {
  text-align: center;
  margin-top: 20px;
  color: #6c757d;
}

.error-message {
  color: #dc3545;
  text-align: center;
  margin-top: 10px;
}
</style>
