import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simulação do banco de dados
const db = {
  users: [],
  tasks: [],
  imcHistory: [],
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('login');

  // Carregar dados ao iniciar
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await AsyncStorage.getItem('users');
      const tasksData = await AsyncStorage.getItem('tasks');
      const imcData = await AsyncStorage.getItem('imcHistory');
      
      if (userData) db.users = JSON.parse(userData);
      if (tasksData) db.tasks = JSON.parse(tasksData);
      if (imcData) db.imcHistory = JSON.parse(imcData);
    } catch (e) {
      console.log('Erro ao carregar dados');
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('users', JSON.stringify(db.users));
      await AsyncStorage.setItem('tasks', JSON.stringify(db.tasks));
      await AsyncStorage.setItem('imcHistory', JSON.stringify(db.imcHistory));
    } catch (e) {
      console.log('Erro ao salvar dados');
    }
  };

  // ============ TELA DE LOGIN ============
  const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);

    const handleSubmit = () => {
      if (!username.trim() || !password.trim()) {
        Alert.alert('Erro', 'Preencha todos os campos');
        return;
      }

      if (isRegister) {
        const exists = db.users.find(u => u.username === username);
        if (exists) {
          Alert.alert('Erro', 'Usuário já existe');
          return;
        }
        const newUser = { id: Date.now(), username, password };
        db.users.push(newUser);
        saveData();
        Alert.alert('Sucesso!', 'Usuário criado! Faça login agora.');
        setIsRegister(false);
        setPassword('');
      } else {
        const user = db.users.find(u => u.username === username && u.password === password);
        if (user) {
          setCurrentUser(user);
          setIsLoggedIn(true);
          setCurrentScreen('main');
        } else {
          Alert.alert('Erro', 'Usuário ou senha incorretos');
        }
      }
    };

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>{isRegister ? '📝 Criar Conta' : '🔐 Login'}</Text>
          <Text style={styles.subtitle}>
            {isRegister ? 'Cadastre-se para começar' : 'Entre para continuar'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Usuário"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>{isRegister ? 'Cadastrar' : 'Entrar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
            <Text style={styles.link}>
              {isRegister ? 'Já tem conta? Fazer login' : 'Não tem conta? Cadastre-se'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ============ TELA PRINCIPAL ============
  const MainScreen = () => {
    const apps = [
      { id: 'imc', name: '🏥 IMC', description: 'Calcule seu IMC' },
      { id: 'tasks', name: '✅ Tarefas', description: 'Organize suas tarefas' },
      { id: 'temp', name: '🌡️ Temperatura', description: 'Fahrenheit ↔ Celsius' },
      { id: 'soon', name: '🔒 Em breve', description: 'Próxima função' },
    ];

    return (
      <View style={styles.containerMain}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Olá, {currentUser.username}! 👋</Text>
          <TouchableOpacity onPress={() => {
            setIsLoggedIn(false);
            setCurrentUser(null);
            setCurrentScreen('login');
          }}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.appsGrid}>
          {apps.map(app => (
            <TouchableOpacity
              key={app.id}
              style={[styles.appCard, app.id === 'soon' && styles.appCardDisabled]}
              onPress={() => app.id !== 'soon' && setCurrentScreen(app.id)}
              disabled={app.id === 'soon'}
            >
              <Text style={styles.appName}>{app.name}</Text>
              <Text style={styles.appDesc}>{app.description}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // ============ APP IMC ============
  const ImcScreen = () => {
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [result, setResult] = useState(null);

    const calculate = () => {
      const w = parseFloat(weight);
      const h = parseFloat(height);

      if (!w || !h || w <= 0 || h <= 0) {
        Alert.alert('Erro', 'Digite valores válidos');
        return;
      }

      const imc = (w / (h * h)).toFixed(2);
      let classification = '';

      if (imc < 18.5) classification = 'Abaixo do peso';
      else if (imc < 25) classification = 'Peso normal';
      else if (imc < 30) classification = 'Sobrepeso';
      else if (imc < 35) classification = 'Obesidade Grau I';
      else if (imc < 40) classification = 'Obesidade Grau II';
      else classification = 'Obesidade Grau III';

      setResult({ imc, classification });

      db.imcHistory.push({
        id: Date.now(),
        userId: currentUser.id,
        weight: w,
        height: h,
        imc,
        classification,
        date: new Date().toLocaleString()
      });
      saveData();
    };

    return (
      <ScrollView style={styles.screenContainer}>
        <TouchableOpacity onPress={() => setCurrentScreen('main')} style={styles.backButton}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.screenTitle}>🏥 Calculadora de IMC</Text>

          <TextInput
            style={styles.input}
            placeholder="Peso (kg)"
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />

          <TextInput
            style={styles.input}
            placeholder="Altura (m) - Ex: 1.75"
            keyboardType="numeric"
            value={height}
            onChangeText={setHeight}
          />

          <TouchableOpacity style={styles.button} onPress={calculate}>
            <Text style={styles.buttonText}>Calcular IMC</Text>
          </TouchableOpacity>

          {result && (
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Seu IMC:</Text>
              <Text style={styles.resultValue}>{result.imc}</Text>
              <Text style={styles.resultClass}>{result.classification}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  // ============ APP TAREFAS ============
  const TasksScreen = () => {
    const [taskText, setTaskText] = useState('');
    const [tasks, setTasks] = useState(
      db.tasks.filter(t => t.userId === currentUser.id)
    );

    const addTask = () => {
      if (!taskText.trim()) return;

      const newTask = {
        id: Date.now(),
        userId: currentUser.id,
        text: taskText,
        done: false
      };

      db.tasks.push(newTask);
      setTasks([...db.tasks.filter(t => t.userId === currentUser.id)]);
      saveData();
      setTaskText('');
    };

    const toggleTask = (id) => {
      const task = db.tasks.find(t => t.id === id);
      if (task) task.done = !task.done;
      setTasks([...db.tasks.filter(t => t.userId === currentUser.id)]);
      saveData();
    };

    const deleteTask = (id) => {
      db.tasks = db.tasks.filter(t => t.id !== id);
      setTasks([...db.tasks.filter(t => t.userId === currentUser.id)]);
      saveData();
    };

    return (
      <View style={styles.screenContainer}>
        <TouchableOpacity onPress={() => setCurrentScreen('main')} style={styles.backButton}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.screenTitle}>✅ Lista de Tarefas</Text>

          <View style={styles.taskInputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 10 }]}
              placeholder="Nova tarefa..."
              value={taskText}
              onChangeText={setTaskText}
            />
            <TouchableOpacity style={styles.addButton} onPress={addTask}>
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.tasksList}>
            {tasks.map(task => (
              <View key={task.id} style={styles.taskItem}>
                <TouchableOpacity onPress={() => toggleTask(task.id)} style={{ flex: 1 }}>
                  <Text style={[styles.taskText, task.done && styles.taskDone]}>
                    {task.done ? '✓ ' : '○ '}{task.text}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteTask(task.id)}>
                  <Text style={styles.deleteText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  // ============ APP TEMPERATURA ============
  const TempScreen = () => {
    const [temp, setTemp] = useState('');
    const [fromUnit, setFromUnit] = useState('C');
    const [result, setResult] = useState(null);

    const convert = () => {
      const t = parseFloat(temp);
      if (isNaN(t)) {
        Alert.alert('Erro', 'Digite uma temperatura válida');
        return;
      }

      let converted;
      if (fromUnit === 'C') {
        converted = (t * 9/5) + 32;
        setResult({ value: converted.toFixed(1), unit: 'F' });
      } else {
        converted = (t - 32) * 5/9;
        setResult({ value: converted.toFixed(1), unit: 'C' });
      }
    };

    return (
      <ScrollView style={styles.screenContainer}>
        <TouchableOpacity onPress={() => setCurrentScreen('main')} style={styles.backButton}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.screenTitle}>🌡️ Conversor de Temperatura</Text>

          <TextInput
            style={styles.input}
            placeholder="Digite a temperatura"
            keyboardType="numeric"
            value={temp}
            onChangeText={setTemp}
          />

          <View style={styles.unitSelector}>
            <TouchableOpacity
              style={[styles.unitButton, fromUnit === 'C' && styles.unitButtonActive]}
              onPress={() => setFromUnit('C')}
            >
              <Text style={styles.unitText}>°C → °F</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitButton, fromUnit === 'F' && styles.unitButtonActive]}
              onPress={() => setFromUnit('F')}
            >
              <Text style={styles.unitText}>°F → °C</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={convert}>
            <Text style={styles.buttonText}>Converter</Text>
          </TouchableOpacity>

          {result && (
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Resultado:</Text>
              <Text style={styles.resultValue}>{result.value}°{result.unit}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  // RENDERIZAR TELA ATUAL
  if (!isLoggedIn) return <LoginScreen />;
  if (currentScreen === 'main') return <MainScreen />;
  if (currentScreen === 'imc') return <ImcScreen />;
  if (currentScreen === 'tasks') return <TasksScreen />;
  if (currentScreen === 'temp') return <TempScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ec4899',
    justifyContent: 'center',
    padding: 20,
  },
  containerMain: {
    flex: 1,
    backgroundColor: '#ec4899',
    paddingTop: 50,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#fce7f3',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#ec4899',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    color: '#ec4899',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  appsGrid: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  appCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    minHeight: 120,
  },
  appCardDisabled: {
    opacity: 0.5,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  appDesc: {
    fontSize: 14,
    color: '#666',
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: '#ec4899',
    fontSize: 18,
    fontWeight: 'bold',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#fce7f3',
    padding: 20,
    borderRadius: 15,
    marginTop: 20,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 16,
    color: '#666',
  },
  resultValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  resultClass: {
    fontSize: 20,
    color: '#be185d',
    fontWeight: '600',
  },
  taskInputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#ec4899',
    borderRadius: 10,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tasksList: {
    maxHeight: 400,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fce7f3',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  taskText: {
    fontSize: 16,
  },
  taskDone: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  deleteText: {
    fontSize: 20,
  },
  unitSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  unitButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f3f4f6',
    margin: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#ec4899',
  },
  unitText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
